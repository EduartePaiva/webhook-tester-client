import "dotenv/config";
import { io } from "socket.io-client";

async function main() {
    const bearer = await fetch(`${process.env.WEBHOOK_TESTER_URL!}/users/login`, {
        method: "POST",
        body: JSON.stringify({
            email: process.env.EMAIL!,
            password: process.env.PASSWORD!,
        }),
        headers: {
            "content-type": "application/json; charset=utf-8",
        },
    });
    if (bearer.status != 201) {
        throw new Error(`bearer fetch status: ${bearer.status}, ${await bearer.text()}`);
    }
    const accessToken = (await bearer.json()).accessToken;
    if (typeof accessToken !== "string") {
        throw new Error("could not get accessToken");
    }

    const socket = io(process.env.WEBHOOK_TESTER_URL!, {
        auth: {
            token: accessToken,
        },
    });
    // socket.auth
    socket.on("connect", () => {
        console.log(`you connected with ${socket.id}`);
    });

    socket.on("message", (data) => {
        console.log(data);
        socket.emit("message", "hello there");
    });
}

main();
