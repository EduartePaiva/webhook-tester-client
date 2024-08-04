import "dotenv/config";
import { Socket, io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

async function main() {
    try {
        const bearer = await fetch(`${process.env.WEBHOOK_TESTER_URL!}/auth/login`, {
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

        const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
            process.env.WEBHOOK_TESTER_URL!,
            {
                auth: {
                    token: accessToken,
                },
                transports: ["websocket"],
            }
        );
        socket.on("connect_error", (error) => {
            // ...
            console.log("ocorreu um erro: ", error);
        });
        // socket.auth
        socket.on("connect", () => {
            console.log(`you connected with ${socket.id}`);
        });

        const headersList = {
            Accept: "*/*",
            "Content-Type": "application/json",
        };

        socket.on("message", (data) => {
            console.log(JSON.stringify(data.payload));
            const fetchURL = process.env.POST_URL! + data.extra_url;
            console.log("Posting on URL: " + fetchURL);

            fetch(fetchURL, {
                method: "POST",
                body: JSON.stringify(data.payload),
                headers: headersList,
            })
                .then((res) => console.log("O resultado do fetch: " + res.status))
                .catch((err) => console.error(err));
        });
    } catch (err) {
        console.log("error: ", err);
    }
}

main();
