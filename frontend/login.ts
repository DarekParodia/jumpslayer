// Simple login validation (3-20 chars for username and password)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form') as HTMLFormElement | null;
  const username =
      document.getElementById('username') as HTMLInputElement | null;
  const password =
      document.getElementById('password') as HTMLInputElement | null;

  if (!form) return;

  const MIN = 3;
  const MAX = 20;

  const validateLength = (el: HTMLInputElement|null) => {
    if (!el) return;
    const v = el.value ?? '';
    if (v.length < MIN || v.length > MAX) {
      el.setCustomValidity(
          'Must be between ' + MIN + ' and ' + MAX + ' characters');
    } else {
      el.setCustomValidity('');
    }
  };

  if (username)
    username.addEventListener('input', () => {
      validateLength(username);
      username.reportValidity();
    });

  if (password)
    password.addEventListener('input', () => {
      validateLength(password);
      password.reportValidity();
    });

  form.addEventListener('submit', (e) => {
    validateLength(username);
    validateLength(password);
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }
    form.classList.add('was-validated');
  });
});
