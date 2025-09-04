import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import{ ChatService } from '../../../_service/chat.service';
interface Message {
  text: string;
  time: Date;
  isUser: boolean;
  typing?: boolean;
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
  private sessionId: string | null = null;
  constructor(private chatService: ChatService) { }
  ngOnInit(): void {
      this.initializeChat();
  }
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  private initializeChat(): void {
    console.log('Initializing chat...');
    this.chatService.createSession().subscribe({
        next: (response) => {
            console.log('Session created:', response);
            if (response && response.sessionId) {
                this.sessionId = response.sessionId;
                this.loadChatHistory();
                this.addBotMessage("Xin chào! Tôi là trợ lý ảo. Tôi có thể giúp gì cho bạn?");
            } else {
                console.error('Invalid session response:', response);
                this.addBotMessage("Xin lỗi, không thể tạo phiên chat.");
            }
        },
        error: (error) => {
            console.error('Session creation error:', error);
            this.addBotMessage("Xin lỗi, hiện tại không thể kết nối. Vui lòng thử lại sau.");
        }
    });
}
  private loadChatHistory(): void {
    if (!this.sessionId) return;
    
    this.chatService.getChatHistory(this.sessionId).subscribe({
      next: (history) => {
        this.messages = history.map((msg: any) => ({
          text: msg.content,
          time: new Date(msg.timestamp),
          isUser: msg.isUser
        }));
      },
      error: (error) => {
        console.error('Error loading chat history:', error);
      }
    });
  }
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.unreadCount = 0;
    }
  }
    sendMessage(): void {
    if (!this.userInput.trim() || this.isTyping || !this.sessionId) {
        console.log('Validation failed:', {
            userInput: this.userInput,
            isTyping: this.isTyping,
            sessionId: this.sessionId
        });
        return;
    }

    const userMessage = this.userInput.trim();
    this.addUserMessage(userMessage);
    this.userInput = '';
    this.isTyping = true;

    console.log('Sending message:', {
        message: userMessage,
        sessionId: this.sessionId
    });

    this.chatService.sendMessage(userMessage, this.sessionId).subscribe({
        next: (response) => {
            console.log('Raw Bot response:', response); 
            this.isTyping = false; 

            
            let botReply = '';
            if (typeof response === 'string') {
                botReply = response;
            } else if (response && response.reply) {
                botReply = response.reply;
            } else if (response && response.message) {
                botReply = response.message;
            } else if (response && response.response) {
                botReply = response.response;
            } else {
                console.error('Unexpected response format:', response);
                botReply = "Xin lỗi, tôi không thể xử lý câu trả lời lúc này.";
            }

            this.addBotMessage(botReply);
        },
        error: (error) => {
            this.isTyping = false;
            console.error('Error details:', {
                error: error,
                status: error?.status,
                message: error?.message,
                fullError: error
            });
            this.addBotMessage("Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.");
        }
    });
}
  private addUserMessage(text: string): void {
    this.messages.push({
      text,
      time: new Date(),
      isUser: true
    });
    this.scrollToBottom();
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
    this.scrollToBottom();
  }
  private scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = 
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}