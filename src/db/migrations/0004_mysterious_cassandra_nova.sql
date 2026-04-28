CREATE TYPE "public"."room_status" AS ENUM('AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE', 'CLEANING');--> statement-breakpoint
CREATE TABLE "room_booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"check_in" timestamp DEFAULT now() NOT NULL,
	"check_out" timestamp,
	"status" varchar(20) DEFAULT 'ACTIVE'
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_number" varchar(20) NOT NULL,
	"room_type" varchar(50) NOT NULL,
	"price_per_day" numeric(10, 2) NOT NULL,
	"status" "room_status" DEFAULT 'AVAILABLE' NOT NULL,
	"last_cleaned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_number_unique" UNIQUE("room_number")
);
--> statement-breakpoint
CREATE TABLE "room_transactions" (
	"transaction_id" uuid PRIMARY KEY NOT NULL,
	"room_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_booking" ADD CONSTRAINT "room_booking_transaction_id_room_transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."room_transactions"("transaction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_booking" ADD CONSTRAINT "room_booking_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_booking" ADD CONSTRAINT "room_booking_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_transactions" ADD CONSTRAINT "room_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_transactions" ADD CONSTRAINT "room_transactions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;