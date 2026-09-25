import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator -> localhost
// const BASE_URL = 'http://localhost:5000/api'; // iOS simulator

const request = async (method, endpoint, data = null) => {
  const token = await AsyncStorage.getItem('@auth_token');
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  if (data) config.body = JSON.stringify(data);

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return { data: json };
};

export const apiClient = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, data) => request('POST', endpoint, data),
  put: (endpoint, data) => request('PUT', endpoint, data),
  delete: (endpoint) => request('DELETE', endpoint),
};
