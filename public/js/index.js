/* eslint-disable */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { displayMap } from './mapBox';
import { login } from './login';
import { logout } from './login';
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('form--login');
const logoutBtn = document.querySelector('.nav__el--logout');

//values
//delegation
if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations,
  );
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    e.preventDefault();
    login(email, password);
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
