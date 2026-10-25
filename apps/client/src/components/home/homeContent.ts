import {
  BellIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  FileDownIcon,
  HouseIcon,
  type LucideIcon,
  MessageCircleIcon,
  MicroscopeIcon,
} from "lucide-react";

// The public homepage's copy. Prices and tests match the seeded catalogue; the visit hours,
// notice and cut-off match the default Settings.

export interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const steps: Step[] = [
  {
    icon: CalendarDaysIcon,
    title: "Book online",
    text: "Pick your tests and an open morning slot, at least a day ahead. We confirm by email.",
  },
  {
    icon: HouseIcon,
    title: "We come to you",
    text: "A medical team visits your home and collects your sample. Pay online by card, or in cash when they arrive.",
  },
  {
    icon: MicroscopeIcon,
    title: "A doctor reviews it",
    text: "Your sample goes to the lab, and a doctor checks the results before releasing them to you.",
  },
  {
    icon: FileDownIcon,
    title: "Get your results",
    text: "View and download them in your account, and get a notification the moment they're released.",
  },
];

export interface PopularTest {
  category: string;
  note: string;
  name: string;
  description: string;
  price: string;
}

export const popularTests: PopularTest[] = [
  {
    category: "Hematology",
    note: "Results in 24 hours",
    name: "Complete Blood Count",
    description: "Red and white cells, hemoglobin and platelets.",
    price: "₱350",
  },
  {
    category: "Chemistry",
    note: "Fasting needed",
    name: "Lipid Panel",
    description: "Cholesterol, triglycerides, HDL and LDL.",
    price: "₱900",
  },
  {
    category: "Chemistry",
    note: "Diabetes check",
    name: "HbA1c",
    description: "Your average blood sugar over the last 2 to 3 months.",
    price: "₱850",
  },
  {
    category: "Clinical microscopy",
    note: "Urine sample",
    name: "Urinalysis",
    description: "A routine check of your urine.",
    price: "₱150",
  },
  {
    category: "Immunology",
    note: "Thyroid",
    name: "Thyroid Stimulating Hormone",
    description: "Checks how well your thyroid is working.",
    price: "₱950",
  },
  {
    category: "Immunology",
    note: "Early dengue",
    name: "Dengue NS1 Antigen",
    description: "Detects dengue in the first days of fever.",
    price: "₱1,200",
  },
];

export const reasons: Step[] = [
  {
    icon: HouseIcon,
    title: "No trip to the clinic",
    text: "Samples are collected at home, in the morning, on the day you choose.",
  },
  {
    icon: CreditCardIcon,
    title: "Pay your way",
    text: "Secure card payment online through Stripe, or cash to the team at your door.",
  },
  {
    icon: BellIcon,
    title: "Always in the loop",
    text: "Get notified when your booking is accepted, a new time is proposed, or your results are released.",
  },
  {
    icon: MessageCircleIcon,
    title: "Help when you need it",
    text: "Open a support ticket from your account and chat with our team.",
  },
];

export const faqs: { question: string; answer: string }[] = [
  {
    question: "When does the team visit?",
    answer:
      "Home visits run in the morning, from 6:00 AM to 12:00 PM, every day. You choose an open time when you book.",
  },
  {
    question: "How far ahead do I need to book?",
    answer:
      "Book at least 24 hours before your visit, and up to 30 days ahead. Some tests need fasting: the instructions are shown when you book.",
  },
  {
    question: "Can I cancel or change my booking?",
    answer:
      "Yes, up to 24 hours before the visit. If the team needs to move it, we propose a new time and you can accept or decline it.",
  },
  {
    question: "How do I pay?",
    answer:
      "Pay online by card through Stripe, or in cash when the team arrives. Seniors and persons with disability get 20% off every test.",
  },
  {
    question: "When can I see my results?",
    answer:
      "As soon as a doctor releases them, and once the visit is fully paid. You get a notification, and you can view and download them in your account.",
  },
];
