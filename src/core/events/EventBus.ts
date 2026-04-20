// === core/events/EventBus.ts ===
type EventHandler<T> = (event: T) => void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler<any>>> = new Map();

  on<T>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
  }

  off<T>(eventName: string, handler: EventHandler<T>): void {
    this.handlers.get(eventName)?.delete(handler);
  }

  emit<T>(eventName: string, event: T): void {
    this.handlers.get(eventName)?.forEach(handler => handler(event));
  }

  clear(): void {
    this.handlers.clear();
  }
}

// 全域單例
export const eventBus = new EventBus();
