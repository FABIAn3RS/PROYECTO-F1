import axios from 'axios';

const API_KEY = import.meta.env.VITE_THESPORTSDB_API_KEY || '123';

const baseURL = import.meta.env.DEV
  ? '/thesportsdb'
  : `${import.meta.env.VITE_THESPORTSDB_BASE_URL || 'https://www.thesportsdb.com/api/v1/json'}/${API_KEY}`;

const theSportsDbClient = axios.create({
  baseURL,
  timeout: 30000,
});

export default theSportsDbClient;
