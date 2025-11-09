const calculateCompatibilityScore = (userSought, userOffered, otherOffered, otherSought) => {
  const theirOfferedWeWant = otherOffered.filter(skill => 
    userSought.some(sought => sought.toLowerCase().includes(skill.toLowerCase()))
  );
  
  const weOfferTheyWant = userOffered.filter(skill => 
    otherSought.some(sought => sought.toLowerCase().includes(skill.toLowerCase()))
  );
  
  const matchedSkills = [...new Set([...theirOfferedWeWant, ...weOfferTheyWant])];
  const baseScore = matchedSkills.length * 15;
  const mutualMatch = theirOfferedWeWant.length > 0 && weOfferTheyWant.length > 0 ? 20 : 0;
  
  return Math.min(baseScore + mutualMatch, 100);
};

const getUserIdFromToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.user?.id;
  } catch {
    return null;
  }
};

module.exports = {
  calculateCompatibilityScore,
  getUserIdFromToken
};
