/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login.js';
import { displayMap } from './mapbox.js';
import { updateSettings } from './updateUserData.js';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutButton = document.querySelector('.nav__el.nav__el--logout');
const updateForm = document.querySelector('.form.form-user-data');
const updatePassword = document.querySelector('.form.form-user-settings');
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

if (updateForm) {
  updateForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData();
    data.append('email', document.getElementById('email').value);
    data.append('name', document.getElementById('name').value);
    data.append('photo', document.getElementById('photo').files[0]);
    updateSettings(data, 'data');
  });
}

if (updatePassword) {
  updatePassword.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector(
      '.form.form-user-settings .btn.btn--small.btn--green'
    ).textContent = 'Saving...';
    const passwordConfirm = document.getElementById('password-confirm').value;
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    console.log(currentPassword, newPassword, passwordConfirm);
    await updateSettings(
      {
        passwordCurrent: currentPassword,
        password: newPassword,
        passwordConfirm: passwordConfirm
      },
      'password'
    );
    document.querySelector(
      '.form.form-user-settings .btn.btn--small.btn--green'
    ).textContent = 'Save password';
    document.getElementById('password-confirm').value = '';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
  });
}
