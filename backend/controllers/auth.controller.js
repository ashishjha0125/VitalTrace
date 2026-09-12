const bcrypt = require('bcryptjs');
const axios = require('axios');
const db = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { registerSchema, loginSchema } = require('../utils/validators');

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return next(error);

    const { name, email, password } = value;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return next(error);

    const { email, password } = value;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    
    delete user.password_hash;
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};

const githubAuth = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'GitHub code is required' });
    }

    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'Invalid GitHub code' });
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const githubUser = userResponse.data;
    const primaryEmail = emailResponse.data.find(e => e.primary).email;

    let result = await db.query('SELECT * FROM users WHERE github_id = $1 OR email = $2', [
      githubUser.id.toString(),
      primaryEmail
    ]);

    let user = result.rows[0];

    if (user) {
      if (!user.github_id) {
        result = await db.query(
          'UPDATE users SET github_id = $1, avatar_url = $2 WHERE id = $3 RETURNING *',
          [githubUser.id.toString(), githubUser.avatar_url, user.id]
        );
        user = result.rows[0];
      }
    } else {
      result = await db.query(
        'INSERT INTO users (name, email, github_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [githubUser.name || githubUser.login, primaryEmail, githubUser.id.toString(), githubUser.avatar_url]
      );
      user = result.rows[0];
    }

    const token = generateToken({ id: user.id, email: user.email });
    delete user.password_hash;

    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, avatar_url, age, medical_history, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, githubAuth, getMe };
