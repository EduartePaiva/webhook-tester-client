import "dotenv/config";
import { Socket, io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

async function main() {
    try {
        const response = await fetch(`${process.env.WEBHOOK_TESTER_URL!}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({
                email: process.env.EMAIL!,
                password: process.env.PASSWORD!,
            }),
            headers: {
                "content-type": "application/json; charset=utf-8",
            },
        });
        if (response.status != 201) {
            throw new Error(`Response fetch status: ${response.status}, ${await response.text()}`);
        }
        const resJson = await response.json();
        const accessToken = resJson.accessToken;
        if (typeof accessToken !== "string") {
            throw new Error("could not get accessToken");
        }
        const webhookURL = resJson.webhookURL;
        if (typeof webhookURL !== "string") {
            throw new Error("could not get webhookURL");
        }
        console.log(`Your webhookURL is: ${webhookURL}`);
        console.log("Use it in your application");

        const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
            process.env.WEBHOOK_TESTER_URL!,
            {
                auth: {
                    token: accessToken,
                },
                transports: ["websocket"],
                path: "/api/socket.io/",
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
