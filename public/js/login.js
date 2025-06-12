/* eslint-disable */
const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login ',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      alert('logged in successfully');
    }
    window.setTimeout(() => {
      location.assign('/');
    }, 1500);
    console.log(res);
  } catch (err) {
    alert(err.response.data.message);
  }
};
document.querySelector('.login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  console.log(email, password);
  login(email, password);
});
