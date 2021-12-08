function HttpController(gameId, playerId) {
    const jsonHeader = { "Content-Type": "application/json" };
    const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

    return {
        async fetchGameState() {
            // fetches all board states, counters etc.
            let response;
            if (playerId) response = await fetch(`/getGameStats?gameId=${gameId}&playerId=${playerId}`);
            else response = await fetch(`/getGameStats?gameId=${gameId}`);

            if (response.status == 200) return await response.json();
        },
        async postUpdate(moveIndex) {
            // post update to the server on the move that's made
            let body = JSON.stringify({ gameId, playerId, moveIndex });
            const response = await fetch("/postGameUpdate", {
                method: "POST",
                headers: jsonHeader,
                body: body,
            })
            return response.status;
        },
        async waitForTurn() {
            try {
                // await for your turn to come
                const response = await fetch("/waitForTurn", {
                    method: "POST",
                    headers: jsonHeader,
                    body: JSON.stringify({ gameId, playerId })
                })
                if (response.status == 200) return;
                else if (response.status == 504) return await this.waitForTurn();
                else {
                    await timeout(3000);
                    return await this.waitForTurn();
                }
            } catch (error) {
                console.log(`connection failed, reconnecting in 3 seconds...`);
                await timeout(3000);
                return await this.waitForTurn();
            }
        },
        async replay() {
            const response = await fetch("/replay", {
                method: "POST",
                headers: jsonHeader,
                body: JSON.stringify({ gameId, playerId })
            })
            return response.status;
        },
        async waitForReplay() {
            try {
                // await for potential replay request
                const response = await fetch("/waitForReplay", {
                    method: "POST",
                    headers: jsonHeader,
                    body: JSON.stringify({ gameId })
                })
                if (response.status == 200) return;
                else if (response.status == 504) return await this.waitForReplay();
                else {
                    await timeout(3000);
                    return await this.waitForReplay();
                }
            } catch (error) {
                console.log(`connection failed, reconnecting in 3 seconds...`);
                await timeout(3000);
                return await this.waitForReplay();
            }
        },
    }
}