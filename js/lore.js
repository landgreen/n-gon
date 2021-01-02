const lore = {

    dialogue: [
        ``,
        ``,
    ],
    ending() {

    }
}
/*   ending outline
  if no cheats
  after final boss is cleared, player enters a level with no mobs
    level maybe has some environmental damage, so player has an option to die at any time
  player can see text output between two colors of text strings (scientists)
    audio.ambient(current time and date)<br> "text"
  player reads a conversation between the two colors of text
    first time win on east or normal they talk about:
      how many runs the player has done
      they guess why
    player is asked to stand on an in game button to enable the vocoder
      they reveal the player is running simulations, and it isn't real
      they ask the player to communicate
        jump twice if you understand
      they ask the player to enter console commands
        give ammo or tech or something
      They tell the play a console command to permanently enable custom and testing mode (in local storage)
        players can use this command in the future to enable custom and testing without beating the game even if local storage is wiped
      they then tell the player the command to increase the difficulty and the command to restart the game.
    If you win on hard or why:  
      they give the player and option to exit the simulation and entre the real world
        simulation.exit()
        This wipes all local storage, and closes the browser tab
*/