function HttpController(gameId, playerId) {
    const jsonHeader = { "Content-Type": "application/json" };
    const timeout = (ms) => new Promise((res) => setTimeout(res, ms));
    const urlQuery = `gameId=${gameId}` + (playerId ? `&playerId=${playerId}` : '');

    return {
        async fetchGameState() {
            const response = await fetch(`/stats?${urlQuery}`);
            if (response.status === 200) return await response.json();
        },
        async postUpdate(move) {
            if (!playerId) return;
            let body = JSON.stringify({ move });
            const response = await fetch(`/move?${urlQuery}`, {
                method: "POST",
                headers: jsonHeader,
                body: body,
            })
            return response.status;
        },
        async waitForTurn() {
            try {
                // await for your turn to come
                const response = await fetch(`/waitForTurn?${urlQuery}`, { method: "POST" })
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
            if (!playerId) return;
            const response = await fetch(`/replay?${urlQuery}`, { method: "POST" });
            return response.status;
        },
        async waitForReplay() {
            try {
                const response = await fetch(`/waitForReplay?${urlQuery}`, { method: "POST" })
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