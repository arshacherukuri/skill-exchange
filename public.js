document.querySelector(".signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.querySelector(".signup-form input[name='name']").value;
  const email = document.querySelector(".signup-form input[name='email']").value;
  const password = document.querySelector(".signup-form input[name='password']").value;

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const result = await response.json();
  alert(result.message);
});

document.querySelector(".login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.querySelector(".login-form input[name='email']").value;
  const password = document.querySelector(".login-form input[name='password']").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();
  alert(result.message);
});
