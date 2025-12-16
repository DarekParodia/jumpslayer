// Simplified signup validation (3-20 chars, password match)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm') as HTMLFormElement | null;
  const pwd = document.getElementById('password') as HTMLInputElement | null;
  const pwd2 =
      document.getElementById('confirmPassword') as HTMLInputElement | null;

  if (!form) return;

  const setMatch = () => {
    if (!pwd || !pwd2) return;
    pwd2.setCustomValidity(
        pwd.value && pwd2.value && pwd.value !== pwd2.value ?
            'Passwords do not match' :
            '');
  };

  if (pwd)
    pwd.addEventListener('input', () => {
      pwd.reportValidity();
      setMatch();
    });
  if (pwd2)
    pwd2.addEventListener('input', () => {
      setMatch();
      pwd2.reportValidity();
    });

  form.addEventListener('submit', e => {
    setMatch();
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }
    form.classList.add('was-validated');
  });
});