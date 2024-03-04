export enum PollTypes {
  ready = "ready",
  offer = "offer",
  answer = "answer",
  candidate = "candidate",
}

export class Polling {
  private url: string;
  private interval: number;
  private timerId: number | undefined;

  from = "";
  to = "";

  constructor(url: string, interval = 2000) {
    this.url = url;
    this.interval = interval;
  }

  async start(callback: (type: PollTypes, data: string) => void) {
    // this.timerId = window.setInterval(async () => {
    try {
      if (!this.to) return;

      let url = new URL(this.url);
      url.searchParams.append("from", this.from);
      url.searchParams.append("to", this.to);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("POLL RESPONSE", text);
      // const data = await response.json();
      const data = JSON.parse(text);
      callback(data.type, data.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }

    setTimeout(() => this.start(callback), 50);

    // }, this.interval);
  }

  pollLoop() {}

  stop() {
    if (this.timerId !== undefined) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  setData(myName: string, meetId: string) {
    this.from = myName;
    this.to = meetId;
  }

  async post(type: PollTypes, data: string) {
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: this.from, to: this.to, type, data }),
        // credentials: "include",
      });

      console.log("POSTED ", { from: this.from, to: this.to, type });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // return await response.json();
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }
}
