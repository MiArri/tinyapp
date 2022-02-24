const emailLookup = function (email, users) {
  return Object.values(users)
    .find(x => x.email === email)
};

module.exports = { emailLookup };