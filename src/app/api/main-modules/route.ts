import { NextResponse, NextRequest } from 'next/server';

// Define interfaces for our data structures
interface Feature {
  id: number;
  name: string;
  description: string;
  mandays: number;
}

interface SubModule {
  id: number;
  name: string;
  features: Feature[];
}

interface MainModule {
  id: number;
  name: string;
  sub_modules: SubModule[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

  const mockData: MainModule[] = [
    {
      id: 1,
      name: "Account",
      sub_modules: [
        { id: 1, name: "Login", features: [{ id: 1, name: "Email, Password", description: "Phone number verification with OTP code", mandays: 2 }] },
        { id: 2, name: "Register", features: [{ id: 2, name: "Name, Email, Phone Number, Password, Password Confirmation", description: "Verification menggunakan OTP send with email\nCountdown expired OTP Response", mandays: 3 }] },
        { id: 3, name: "Authorization", features: [{ id: 3, name: "Login", description: "Android Phone - iOS iPhone", mandays: 1 }]
        }
      ]
    },
    {
      id: 2,
      name: "Visit Area",
      sub_modules: [
        { id: 4, name: "List Area", features: [{ id: 4, name: "Area Name", description: "Condition...", mandays: 1 }, { id: 5, name: "Location", description: "", mandays: 2 }]
        }
      ]
    },
    {
      id: 3,
      name: "AI ChatGPT",
      sub_modules: [
        { id: 5, name: "Sub Module ChatGPT", features: [{ id: 6, name: "Feature...", description: "Condition...", mandays: 1 }]
        }
      ]
    },
    {
      id: 4,
      name: "Payment Gateway",
      sub_modules: [
        { id: 6, name: "Credit Card", features: [{ id: 7, name: "Visa, Mastercard", description: "Payment processing", mandays: 5 }] },
        { id: 7, name: "E-Wallet", features: [{ id: 8, name: "OVO, GoPay, Dana", description: "Digital wallet integration", mandays: 3 }]
        }
      ]
    },
    {
      id: 5,
      name: "Notification",
      sub_modules: [
        { id: 8, name: "Push Notification", features: [{ id: 9, name: "Firebase FCM", description: "Real-time notifications", mandays: 2 }] },
        { id: 9, name: "Email Notification", features: [{ id: 10, name: "SMTP Integration", description: "Email sending service", mandays: 2 }]
        }
      ]
    }
  ];
  
  const filteredData = query ? mockData.filter(module => 
    module.name.toLowerCase().includes(query.toLowerCase())
  ) : mockData;
  
  return NextResponse.json(filteredData);
  } catch (error) {
    // Handle invalid URL gracefully
    return NextResponse.json([], { status: 400 });
  }
}
