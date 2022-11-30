getLineIndent = require '../src/get-line-indent'

testString = """
To be, or not to be, that is the question:
Whether 'tis Nobler in the mind to suffer
		The Slings and Arrows of outrageous Fortune,
Or to take Arms against a Sea of troubles,
And by opposing end them: to die, to sleep
    No more; and by a sleep, to say we end
The Heart-ache, and the thousand Natural shocks
  That Flesh is heir to? 'Tis a consummation
Devoutly to be wished. To die, to sleep,
To sleep, perchance to Dream
"""

index1 = testString.indexOf 'The Slings'
index2 = testString.indexOf 'No more;'
index3 = testString.indexOf 'That Flesh'

exports['get-line-indent'] = (test) ->
  test.expect 3
  test.equal getLineIndent(index1, testString), '\t\t'
  test.equal getLineIndent(index2, testString), '    '
  test.equal getLineIndent(index3, testString), '  '
  test.done()
