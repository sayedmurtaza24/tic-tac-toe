function MenuController() {
  // helper function
  const _render = (node) => document.querySelector(".mainContainer").innerHTML = node.outerHTML;

  // cache different game menu nodes to render each when needed.
  const menuNode = document.querySelector(".gameMenuContainer");
  const roleChooseNode = document.querySelector(".chooseRoleContainer");
  const linkShareNode = document.querySelector(".gameUrlContainer");

  _render(menuNode);

  let startLink;

  return {
    playLocalMultiplayer() {
      window.location.href = "game.html";
    },
    async selectRole(role) {
      try {
        const response = await fetch(`/api/start`, { method: "POST" });
        const responseJson = await response.json();

        if (response.status != 200) return console.log("Error.");

        _render(linkShareNode);

        const baseLink = `http://${window.location.host}/game.html?gameId=${responseJson.gameId}`;
        const [opponentLinkNode, spectatorLinkNode] = document.querySelectorAll(".urlInput");

        let multiplayerJoinLink;
        if (role == "X") {
          startLink = `${baseLink}&playerId=${responseJson.playerX}`;
          multiplayerJoinLink = `${baseLink}&playerId=${responseJson.playerO}`;
        } else {
          startLink = `${baseLink}&playerId=${responseJson.playerO}`;
          multiplayerJoinLink = `${baseLink}&playerId=${responseJson.playerX}`;
        }
        opponentLinkNode.value = multiplayerJoinLink;
        spectatorLinkNode.value = baseLink;

        document.querySelector("#copyOpponent").onclick = () => {
          navigator.clipboard.writeText(multiplayerJoinLink);
        }

        document.querySelector("#copySpectate").onclick = () => {
          navigator.clipboard.writeText(baseLink);
        }

      } catch (error) {
        console.log("Connection failed")
      }
    },
    startMultiplayerGame() {
      window.location.href = startLink;
    },
    showRoleSelector() {
      _render(roleChooseNode);
    },
    showMenu() {
      _render(menuNode);
    }
  }
}

const menuController = MenuController();