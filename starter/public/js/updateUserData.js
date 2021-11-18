/* eslint-disable */
import axios from 'axios';
import { callAlert } from './alert.js';
export const updateSettings = async (data, type) => {
  const url =
    type === 'password'
      ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
      : 'http://127.0.0.1:3000/api/v1/users/updateMe';
  try {
    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data
    });
    console.log(res.data.status);
    if (res.data.status === 'success') {
      callAlert('success', 'Data update successfully 💗');
    }
  } catch (err) {
    callAlert('error', err.response.data.message);
  }
};
