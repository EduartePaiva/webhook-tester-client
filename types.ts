export interface ServerToClientEvents {
    message: (data: { extra_url: string; payload: string }) => void;
}

export interface ClientToServerEvents {}
