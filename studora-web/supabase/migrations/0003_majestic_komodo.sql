CREATE TABLE "whiteboard" (
	"user_id" text NOT NULL,
	"file_url" text NOT NULL,
	"canvas_data" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whiteboard_user_id_file_url_pk" PRIMARY KEY("user_id","file_url")
);
--> statement-breakpoint
ALTER TABLE "whiteboard" ADD CONSTRAINT "whiteboard_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;