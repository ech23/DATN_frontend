export interface ChatMessage {
  text: string;
  time: Date;
  isUser: boolean;
  typing?: boolean;
}