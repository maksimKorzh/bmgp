# BMGP
Bare Minimum Go Program

# Motivation
I wanted to to implement the rules of Go +
some very basic AI to play with so that it
could do two things - complete the game and
win if human player plays weird moves.

# Heuristics
This was the biggest challenge. First I tried
hard code 1 ply moves like save or kill the group if
in atari along with rendom tenuki moves. There were
two major issues - move priorities turned into a mess
when there were too many groups on board, with random
tenuki game seemed to be infinite because computer.
did not try to achieve game objective - gain territory.
<br><br>
Then I used recursive search with evaluation function
to count stone and liberties difference plus counting
territory occupied by the side - this was slow as hell
and max depth I could reach was 2 ply, so it was even
worse than the previous version.
<br><br>
Finally I have limited the search to explore only those
groups that have less than three liberties and simplified
the evaluation to only count stones. It suddenly started
to play more less reasonable fighting moves at 4 ply depth.
This worked on all the board sizes up to 19x19. But I still
could not find the way how to make engine making territory
without particularly knowing anything about it. After a
long struggling I finaly changed my tenuki function so that
it could take corners and sides if possible and then do only
1 type of move - attach stone to user's stone. Surpisingly
it worked! When user builds a wall engine would usually block it
and if user builds a small group in the corner engine would try
to surround it. With this simple trick I managed to implement
heuristics that knows nothing about territory, meanwhile it
can beat human player if he only builds small groups on the
sides - it just happens engine takes the entire center without
even realizing it.

# How to play with white?
Before making the first move open DevTools and type: "play(4)",
then hit enter. Engine would make a move, you can now play with
white stones.

# How to give engine a handicap?
Before starting the game you can set additional stones
from the DevTools, e.g. type: "board[sq] = BLACK; drawBoard();",
this would put a stone to "sq", note board is 1d array.

# Play vs BMGP
<a href="https://maksimkorzh.github.io/bmgp/bmgp.html">Play now</a>
