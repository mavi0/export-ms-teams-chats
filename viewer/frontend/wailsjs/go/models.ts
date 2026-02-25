export namespace main {
	
	export class LoadResult {
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new LoadResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.error = source["error"];
	    }
	}

}

export namespace model {
	
	export class Attachment {
	    name: string;
	    contentUrl: string;
	    contentType: string;
	
	    static createFrom(source: any = {}) {
	        return new Attachment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.contentUrl = source["contentUrl"];
	        this.contentType = source["contentType"];
	    }
	}
	export class Body {
	    contentType: string;
	    content: string;
	    contentProcessed?: string;
	
	    static createFrom(source: any = {}) {
	        return new Body(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.contentType = source["contentType"];
	        this.content = source["content"];
	        this.contentProcessed = source["contentProcessed"];
	    }
	}
	export class ChatSummary {
	    id: string;
	    name: string;
	    lastMessageDate: string;
	    memberCount: number;
	    chatType: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.lastMessageDate = source["lastMessageDate"];
	        this.memberCount = source["memberCount"];
	        this.chatType = source["chatType"];
	    }
	}
	export class From {
	    id: string;
	    displayName: string;
	
	    static createFrom(source: any = {}) {
	        return new From(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.displayName = source["displayName"];
	    }
	}
	export class SystemEvent {
	    "@odata.type"?: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new SystemEvent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this["@odata.type"] = source["@odata.type"];
	        this.description = source["description"];
	    }
	}
	export class Message {
	    id: string;
	    messageType: string;
	    createdDateTime: string;
	    from: From;
	    importance: string;
	    deletedDateTime?: string;
	    lastEditedDateTime?: string;
	    isFromMe: boolean;
	    body: Body;
	    attachments: Attachment[];
	    systemEvent?: SystemEvent;
	
	    static createFrom(source: any = {}) {
	        return new Message(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.messageType = source["messageType"];
	        this.createdDateTime = source["createdDateTime"];
	        this.from = this.convertValues(source["from"], From);
	        this.importance = source["importance"];
	        this.deletedDateTime = source["deletedDateTime"];
	        this.lastEditedDateTime = source["lastEditedDateTime"];
	        this.isFromMe = source["isFromMe"];
	        this.body = this.convertValues(source["body"], Body);
	        this.attachments = this.convertValues(source["attachments"], Attachment);
	        this.systemEvent = this.convertValues(source["systemEvent"], SystemEvent);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchResult {
	    chatId: string;
	    chatName: string;
	    messageId: string;
	    snippet: string;
	    from: string;
	    createdDateTime: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chatId = source["chatId"];
	        this.chatName = source["chatName"];
	        this.messageId = source["messageId"];
	        this.snippet = source["snippet"];
	        this.from = source["from"];
	        this.createdDateTime = source["createdDateTime"];
	    }
	}

}

