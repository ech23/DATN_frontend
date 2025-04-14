import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';

interface Message {
  text: string;
  time: Date;
  isUser: boolean;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  messages: Message[] = [];
  isTyping = false;
  unreadCount = 0;

  private readonly botResponses = {
    greeting: [
      "Hello! How can I help you today?",
      "Hi there! What can I do for you?",
      "Welcome! How may I assist you?"
    ],
    goodbye: [
      "Goodbye! Have a great day!",
      "See you later! Take care!",
      "Bye! Feel free to come back if you need anything!"
    ],
    thanks: [
      "You're welcome!",
      "No problem at all!",
      "Glad I could help!"
    ],
    default: [
      "I'm not sure I understand. Could you please rephrase that?",
      "I'm still learning. Could you try asking that differently?",
      "I don't have an answer for that yet. Is there something else I can help you with?"
    ]
  };

  constructor() {
    // Add initial bot message
    this.addBotMessage("Hello! I'm your customer support assistant. How can I help you today?");
  }

  ngOnInit(): void {
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.unreadCount = 0;
    }
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isTyping) return;

    const userMessage = this.userInput.trim();
    this.addUserMessage(userMessage);
    this.userInput = '';

    // Simulate bot typing
    this.isTyping = true;
    setTimeout(() => {
      this.handleBotResponse(userMessage);
      this.isTyping = false;
    }, 1000);
  }

  private handleBotResponse(userMessage: string): void {
    const lowerMessage = userMessage.toLowerCase();

    if (this.containsAny(lowerMessage, ['hi', 'hello', 'hey'])) {
      this.addBotMessage(this.getRandomResponse(this.botResponses.greeting));
    }
    else if (this.containsAny(lowerMessage, ['bye', 'goodbye', 'see you'])) {
      this.addBotMessage(this.getRandomResponse(this.botResponses.goodbye));
    }
    else if (this.containsAny(lowerMessage, ['thanks', 'thank you', 'appreciate it'])) {
      this.addBotMessage(this.getRandomResponse(this.botResponses.thanks));
    }
    else if (this.containsAny(lowerMessage, ['price', 'cost', 'expensive', 'cheap'])) {
      this.addBotMessage("Our prices are competitive and vary by product. You can check specific prices in our product catalog.");
    }
    else if (this.containsAny(lowerMessage, ['shipping', 'delivery', 'ship'])) {
      this.addBotMessage("We offer free shipping on orders over $50. Standard delivery takes 3-5 business days.");
    }
    else if (this.containsAny(lowerMessage, ['return', 'refund', 'exchange'])) {
      this.addBotMessage("We have a 30-day return policy. Items must be unused and in their original packaging.");
    }
    else {
      this.addBotMessage(this.getRandomResponse(this.botResponses.default));
    }
  }

  private addUserMessage(text: string): void {
    this.messages.push({
      text,
      time: new Date(),
      isUser: true
    });
  }

  private addBotMessage(text: string): void {
    this.messages.push({
      text,
      time: new Date(),
      isUser: false
    });
    if (!this.isOpen) {
      this.unreadCount++;
    }
  }

  private getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private containsAny(str: string, keywords: string[]): boolean {
    return keywords.some(keyword => str.includes(keyword));
  }

  private scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
} 