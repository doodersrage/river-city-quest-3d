# River City Quest 3D

**Play it: https://doodersrage.github.io/river-city-quest-3d/**

A low-poly, PS1-style take on [River City Quest](https://github.com/doodersrage/river-city-quest), the Zelda-like adventure set in Richmond, Virginia. A cold fog has rolled up off the James and the gas lamps are going dark. The archivist at the Capitol needs four keystones to open the old Church Hill Tunnel, where something is waiting under the hill.

The whole story is here, from the first lantern to the tunnel finale: all 24 neighborhoods, 55 buildings and dungeon rooms, seven bosses and every item.

| | |
|---|---|
| ![Title](screenshots/title.png) | ![Carytown](screenshots/carytown.png) |
| ![The Pyramid Wraith](screenshots/pyramid-wraith.png) | ![The Titan Arum](screenshots/titan-arum.png) |
| ![Paddling the James](screenshots/kayak.png) | ![The Hall of Lamps](screenshots/hall-of-lamps.png) |
| ![The Great Bell](screenshots/great-bell.png) | ![The bus map](screenshots/bus-map.png) |
| ![Church Hill](screenshots/church-hill.png) | ![Church Hill at night](screenshots/night.png) |
| ![Byrd Park](screenshots/byrd-park.png) | ![Old Snapper](screenshots/old-snapper.png) |
| ![A Shockoe street](screenshots/shockoe-street.png) | ![Rats, geese, crabs and bats](screenshots/creatures.png) |
| ![Batting practice](screenshots/batting.png) | ![The Libby Hill soapbox derby](screenshots/soapbox-derby.png) |
| ![Richmond Raceway](screenshots/raceway.png) | ![Pinball at the Stone House](screenshots/pinball.png) |
| ![A dog in Byrd Park in the fall](screenshots/fall-dog.png) | ![Rain in Shockoe Bottom](screenshots/rain.png) |
| ![Fishing off Belle Isle](screenshots/fishing.png) | ![Free throws at the Siegel Center](screenshots/free-throws.png) |

## What's in it

- **All of Richmond in 3D:** 24 neighborhoods, built tile for tile from the 2D game, from Scott's Addition and Carytown to Manchester, Bryan Park, Chimborazo and the Richmond Raceway. Walk from one into the next, or ride the GRTC bus between any two you've visited.
- **Landmarks:** the Capitol, Main Street Station, the 17th Street Market, St. John's Church, the Carillon, Maymont, the Hollywood Cemetery pyramid, VMFA, the Byrd Theatre, the Science Museum, Agecroft Hall, the Siegel Center, Engine 231 and more.
- **Buildings you can walk into:** museums, theaters, a bank, a tea room, a taproom, an arcade, an art studio, rowhouses and the Carytown shop, each with its own people and stories.
- **Seven dungeons and seven bosses:** the Belle Isle Quarry and Old Snapper, the Hollywood pyramid and its wraith, the Poe Museum and the Raven, the Carillon and the Great Bell, Tredegar and the Iron Foreman, the Conservatory and the Titan Arum, and the Church Hill Tunnel finale.
- **Puzzles:** small keys and locked doors, cracked walls for blasting powder, braziers to light with the lantern, blocks to push onto floor switches, sprouts that grow vine bridges, and posts to grapple across pits.
- **Every item:** the gas lantern, baseballs, blasting powder, the Gold-Bug, running shoes, the grappling hook, the watering can, a bottle of ginger beer that saves you when you fall, the cast-iron shield, heart pieces, and a kayak that crosses the whitewater on the James.
- **The trade chain, the shop and challenges:** swap your way from the market to a kayak, spend coins at Carytown Goods, and win pins from people all over town. Collect all of them and your paddle turns gold.
- **Detailed streets:** brick buildings with sills, cornices, awnings, stoops and balconies, plus hydrants, newspaper boxes, signs and parked cars. Rocks break the James with foam, trees sway, people nod while they talk, and pigeons scatter when you walk up.
- **A third-person camera** that trails behind you like late-90s 3D adventures. Swing it with a drag, the right stick or Q and E. Indoors it holds a fixed angle over each room.
- **Day and night:** a full day passes about every ten minutes. At night the fog closes in, the gas lamps glow and ghosts come out.
- **The PS1 look, done by hand:** everything renders at 320x240, vertices snap to that pixel grid so they wobble, textures warp without perspective correction, colors are dithered down to 15 bits, and fog hides the short draw distance. There's no 3D library: it's plain WebGL 2.
- **Sound:** synthesized effects and soft looping music washed in reverb.
- **Phones:** a touch stick, A, B, ITEM and MENU buttons, and drag on the right side of the screen to turn the camera. Portrait and landscape both work.
- **Saves** to your browser, and the game works offline once it's loaded.

- **Seven mini-games, each with its own little 3D set:** batting practice at The Diamond, free throws at the Siegel Center, tennis against the ball machine on Arthur Ashe Boulevard, River City Ramble pinball in the Stone House arcade, and three races: the Libby Hill soapbox derby, the Capital Trail time trial on a bike and the Richmond Raceway dash. Races give gold, silver or bronze, and your records go in the album.
- **A dog of your own:** adopt one from the shelter volunteer in Manchester. It follows you, chases pests, sniffs out each neighborhood's hidden stash and digs up treats.
- **Food and your row house:** buy a picnic basket and ingredients at the 17th Street Market or a box lunch at Sally Bell's, cook at the stove in your own row house in the Fan, sleep in your bed, read your mail and fill it with furniture from Carytown.
- **Fishing, photos and a bike:** cast for five kinds of fish (the sturgeon only lives in the James), photograph 30 landmarks for your album, and ride the cyclist's old bike around town.
- **Weather and seasons:** rain, fog and snow roll through, frogs come out in the rain for the naturalist, fireflies light up leafy parks on clear nights, and the trees follow the real calendar: blossoms in spring, orange and gold in the fall.
- **Events:** First Friday art walks on Broad Street with a missing-paintings mystery, holiday lights in December, the Folk Festival and Riverrock on Brown's Island, and Monument Avenue 10K runners in the spring.

## Controls

| | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | WASD or arrows | Left stick | Stick |
| Talk, read, open, swing | J, Space or Z | A | A |
| Use item | K, Shift or X | B / X | B |
| Switch item | L, Tab or C | Y / RB | ITEM |
| Camera | Q and E | Right stick, LT / RT | Drag on the right |
| Menu | Enter or Esc | Start | MENU |

## How it's built

Plain JavaScript and WebGL 2, no build step and no libraries. The scripts load in order from `index.html` and share one global scope.

- `js/data.js`: the places, people, stories, buildings and dungeons, imported from the 2D game by `tools/import-2d.js`. Don't edit it by hand.
- `js/mesh.js`: geometry helpers and the texture atlas layout
- `js/tex.js`: the 32x32 textures, painted in code at startup
- `js/level.js`: turns a 2D tile map into a 3D place
- `js/models.js`: low-poly people, creatures and props
- `js/game.js`: the game itself, with no drawing in it
- `js/talk.js`: what everyone says
- `js/life.js`: the dog, food, fishing, photos, the bike, weather, seasons and events
- `js/mini.js`: the mini-games and their sets
- `js/render.js`: the PS1-style WebGL renderer
- `js/hud.js`: hearts, dialog windows, the pause menu and the title
- `js/input.js`, `js/audio.js`, `js/main.js`: controls, sound and the frame loop

To pull fresh data from the 2D game, check both repos out side by side and run:

```
node tools/import-2d.js ../river-city-quest
```

## Tests

```
node tests/run.js
```

The tests load the game into Node without a screen. `playthrough.test.js` has a bot play the opening: get the lantern, walk to Belle Isle, clear the quarry, unlock the door, blow the wall, beat Old Snapper and bring the keystone home. `dungeons.test.js` checks that every door goes somewhere, every dungeon room connects to its entrance, and a bot beats all seven bosses through to the credits. `puzzles.test.js` uses each item on the puzzle it's for. `mini.test.js` has a bot play every mini-game to the end, and `life.test.js` covers the dog, cooking, fishing, photos, the bike, stashes, weather, frogs and First Friday. `camera.test.js` walks out of every building and checks the camera can see you. `features.test.js` covers markers, all four challenges, bushes, nighttime, dying and the menu. GitHub Actions runs them on every push.
