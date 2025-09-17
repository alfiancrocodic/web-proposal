import { NextResponse, NextRequest } from 'next/server';

// --- TYPE DEFINITIONS ---
interface Feature {
  id: number;
  name: string;
  description: string;
  mandays: number;
  selected: boolean;
}

interface SubModule {
  id: number;
  name: string;
  selected: boolean;
  features: Feature[];
}

interface MainModule {
  id: number;
  name: string;
  selected: boolean;
  subModules: SubModule[];
}

interface ProposalContent {
  featureSales: {
    mainModules: MainModule[];
  };
  totalMandays: number;
  lastUpdated?: string;
}

interface MockData {
  [key: number]: ProposalContent;
}

// Mock data untuk proposal content
const mockProposalContent: MockData = {
  1: {
    featureSales: {
      mainModules: [
        {
          id: 1,
          name: "Account",
          selected: true,
          subModules: [
            {
              id: 1,
              name: "Login",
              selected: true,
              features: [
                {
                  id: 1,
                  name: "Email, Password",
                  description: "Phone number verification with OTP code",
                  mandays: 2,
                  selected: true
                }
              ]
            },
            {
              id: 2,
              name: "Register",
              selected: false,
              features: [
                {
                  id: 2,
                  name: "Name, Email, Phone Number, Password, Password Confirmation",
                  description: "Verification menggunakan OTP send with email\nCountdown expired OTP Response",
                  mandays: 3,
                  selected: false
                }
              ]
            }
          ]
        },
      ]
    },
    totalMandays: 2,
    lastUpdated: new Date().toISOString()
  }
};

interface RouteParams {
  params: { id: string };
}

/**
 * GET handler untuk mendapatkan content proposal
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params;
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const content = mockProposalContent[Number(id)] || {
      featureSales: { mainModules: [] },
      totalMandays: 0
    };
    
    return NextResponse.json(content);

  } catch (error) {
    console.error('Error getting proposal content:', error);
    return NextResponse.json(
      { error: 'Failed to get proposal content' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler untuk menyimpan content proposal
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params;
    const body: ProposalContent = await request.json();
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    mockProposalContent[Number(id)] = {
      ...body,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Proposal ${id} content updated:`, mockProposalContent[Number(id)]);
    
    return NextResponse.json(
      { message: 'Content saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving proposal content:', error);
    return NextResponse.json(
      { error: 'Failed to save proposal content' },
      { status: 500 }
    );
  }
}
