export class Listeners<L> {
  private next: number = 0;
  private listeners: any = {};

  addListener(l: L): () => void {
    const key = this.next;
    this.next++;
    this.listeners[key] = l;
    return () => {
      delete this.listeners[key];
    }
  }

  forEachListener(f: (l: L) => void): void {
    for (let k in this.listeners) {
      if (this.listeners.hasOwnProperty(k)) f(this.listeners[k]);
    }
  }
}
