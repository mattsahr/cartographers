
### Cartographers Score Card

This is a score card for the board game ***Cartographers*** by Thunderworks Games.

[[Get the board game](https://www.thunderworksgames.com/cartographers.html)].

The score cards should let you play remotely, with a zoom/skype/hangouts call for the actual, like, human interaction part -- someone to flip and show the cards, etc.

[[Go to the score card](https://mattsahr.github.io/cartographers/)]

**Included stuff**  

- a slightly modified version of Alexey Kryazhev's [[ispinjs](https://github.com/uNmAnNeR/ispinjs)] library.

- Many of the tile patterns are from Lea Verou's amazing [[gallery](https://leaverou.github.io/css3patterns/)] of CSS gradients.

- Google's [[Firebase](https://firebase.google.com/)], to network players together.
 
- Valve's creepy [[fingerprint2](https://github.com/Valve/fingerprintjs2/)] broswer tracker.  This is to make (mostly) unique id's for players without their need to do anything.  This lets lots of players call themselves short normal names like "Ed", instead of "Ed__234567".

**Code Style, compatibility**

Written in a bog-standard es5 flavor of javascript.  

Had I known at the beginning I was going to add network interaction, I may have rethought that, maybe used React or Svelte.  But the surface area is just not that large.  And really, the Firebase client is all about promise-style callbacks anyway, it fits fine in an es5 workflow.

I used the DOM element `classlist` method.  Even *IE10* sortof supports that?  However, I can't say it's tested much outside of recent Chrome, Firefox & IE Edge.

There are no modules or requires, but the app is chopped into a few pieces.  Files past 800 lines I find increasingly annoying to work with.  Also, the module or pseudo-module interface helps one think in discrete chunks.  To bridge the pieces together, the app shares three global objects: 

```javascript  
constants = { ... }   
methods = { ... }  
uxState = { ... } 
```

Due to the libraries involved, `ISpin`, `Fingerprint2` and `firebase` are also global objects. 