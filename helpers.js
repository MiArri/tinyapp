//function generates a random string
const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 63));
  }
  return result;
};

//function returns a user object when it's provided with an email that exists in the database

const getUserByEmail = function (email, users) {
  return Object.values(users)
    .find(x => x.email === email)
};

//function checks if the user is logged in
const getCurrentUser = (req, users) => {
  const userId = req.session.user;
  if (users[userId]) {
    return users[userId];
  }
  return null;
};

//function checks the database if there are urls that belong to a specific user
const urlsForUser = function (urls, userId) {
  const userURLs = {};
  for (const shortURL in urls) {
    const url = urls[shortURL];
    if (url.userID === userId) {
      userURLs[shortURL] = url;
    }
  }
  return userURLs;
};

module.exports = { generateRandomString, getUserByEmail, getCurrentUser, urlsForUser };