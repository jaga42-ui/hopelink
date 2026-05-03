const calculateRank = (points) => {
  if (points >= 2500) return "Apex Savior";
  if (points >= 1000) return "Platinum Hero";
  if (points >= 500) return "Gold Guardian";
  if (points >= 250) return "Silver Shield";
  if (points >= 100) return "Bronze Responder";
  return "Rookie";
};

const getPointsForAction = (action) => {
  const pointsMap = {
    'RESPOND_SOS': 100,
    'SUCCESSFUL_DONATION': 50,
    'RECEIVE_DONATION': 20,
    'SUBMIT_APP_FEEDBACK': 10,
  };
  return pointsMap[action] || 0;
};

module.exports = { calculateRank, getPointsForAction };
