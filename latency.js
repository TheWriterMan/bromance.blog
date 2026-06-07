const start = Date.now();
fetch('http://localhost:3000/api/posts')
  .then(res => res.json())
  .then(data => {
    console.log(`Fetch /api/posts took ${Date.now() - start}ms`);
  })
  .catch(console.error);

fetch('http://localhost:3000/api/posts/2019-06-29_The-clamor-for-the-Death-Penalty-for-Rapists-of-Minors-a12a97e7183b.html')
  .then(res => res.json())
  .then(data => {
    console.log(`Fetch /api/posts/[id] took ${Date.now() - start}ms`);
  })
  .catch(console.error);
