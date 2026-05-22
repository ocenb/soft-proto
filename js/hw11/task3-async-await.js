// Задание 3. Работа с async/await
// Версия задания 2 с async/await, delay(ms) и try...catch.

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function fetchData(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url === '/api/users') {
        resolve(users);
        return;
      }

      if (url.startsWith('/api/users/')) {
        const id = Number(url.split('/').pop());
        const user = users.find((item) => item.id === id);

        if (user) {
          resolve(user);
        } else {
          reject(new Error(`Пользователь с id=${id} не найден`));
        }
        return;
      }

      reject(new Error(`Неизвестный URL: ${url}`));
    }, 2000);
  });
}

async function run() {
  try {
    const userList = await fetchData('/api/users');
    console.log('Список пользователей:', userList);

    if (!userList.length) {
      throw new Error('Список пользователей пуст');
    }

    // Пауза между запросами
    await delay(500);

    const firstUser = await fetchData(`/api/users/${userList[0].id}`);
    console.log('Первый пользователь:', firstUser);
  } catch (error) {
    console.error('Ошибка в async/await:', error.message);
  }
}

run();
