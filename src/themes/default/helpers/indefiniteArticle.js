// Figures out whether an 'a' or an 'an' should be used
// in front of a phrase.
//
// Thanks be to: https://github.com/rigoneri/indefinite-article.js
module.exports = function (phrase, _options) {
  // Getting the first word
  var match = /\w+/.exec(phrase)
  if (match) var word = match[0]
  else return 'an'

  var l_word = word.toLowerCase()
  // Specific start of words that should be preceded by 'an'
  var alt_cases = ['honest', 'hour', 'hono']
  for (var i in alt_cases) {
    if (l_word.indexOf(alt_cases[i]) == 0) return 'an'
  }

  // Single letter word which should be preceded by 'an'
  if (l_word.length == 1) {
    if ('aedhilmnorsx'.indexOf(l_word) >= 0) return 'an'
    else return 'a'
  }

  // Capital words which should likely be preceded by 'an'
  if (
    word.match(
      /(?!FJO|[HLMNS]Y.|RY[EO]|SQU|(F[LR]?|[HL]|MN?|N|RH?|S[CHKLMNPTVW]?|X(YL)?)[AEIOU])[FHLMNRSX][A-Z]/
    )
  ) {
    return 'an'
  }

  // Special cases where a word that begins with a vowel should be preceded by 'a'
  const regexes = [
    /^e[uw]/,
    /^onc?e\b/,
    /^uni([^nmd]|mo)/,
    /^u[bcfhjkqrst][aeiou]/,
  ]
  for (var regex in regexes) {
    if (l_word.match(regexes[regex])) return 'a'
  }

  // Special capital words (UK, UN)
  if (word.match(/^U[NK][AIEO]/)) {
    return 'a'
  } else if (word == word.toUpperCase()) {
    if ('aedhilmnorsx'.indexOf(l_word[0]) >= 0) return 'an'
    else return 'a'
  }

  // Basic method of words that begin with a vowel being preceded by 'an'
  if ('aeiou'.indexOf(l_word[0]) >= 0) return 'an'

  // Instances where y followed by specific letters is preceded by 'an'
  if (l_word.match(/^y(b[lor]|cl[ea]|fere|gg|p[ios]|rou|tt)/)) return 'an'

  return 'a'
}
