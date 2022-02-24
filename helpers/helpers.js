const emailLookup = function (email, users) {
  return Object.values(users)
    .find(x => x.email === email)
};

const getCurrentUser = (req, users) => {
  const userId = req.session.user;
  if (users[userId]) {
    return users[userId];
  }

  return null;
};

const urlsForUser = function (urls, userId) {
  const userURLs = {};
  for (const shortURL in urls) {
    const url = urls[shortURL];
    if (url.userId === userId) {
      userURLs[shortURL] = url;
    }
  }

  return userURLs;
};

module.exports = { emailLookup, getCurrentUser, urlsForUser };