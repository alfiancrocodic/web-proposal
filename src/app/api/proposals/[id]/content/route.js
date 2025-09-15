/**
 * API Route untuk mendapatkan dan menyimpan content proposal
 * Mock implementation untuk development
 */

// Mock data untuk proposal content
const mockProposalContent = {
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
        {
          id: 2,
          name: "Payment Gateway",
          selected: false,
          subModules: [
            {
              id: 3,
              name: "Credit Card",
              selected: false,
              features: [
                {
                  id: 3,
                  name: "Visa, Mastercard",
                  description: "Secure payment processing",
                  mandays: 5,
                  selected: false
                }
              ]
            }
          ]
        }
      ]
    },
    totalMandays: 2,
    lastUpdated: new Date().toISOString()
  }
};

/**
 * GET handler untuk mendapatkan content proposal
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Simulasi delay network
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const content = mockProposalContent[id] || {
      featureSales: { mainModules: [] },
      totalMandays: 0
    };
    
    return Response.json(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error getting proposal content:', error);
    return Response.json(
      { error: 'Failed to get proposal content' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler untuk menyimpan content proposal
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Simulasi delay network
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Update mock data
    mockProposalContent[id] = {
      ...body,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Proposal ${id} content updated:`, mockProposalContent[id]);
    
    return Response.json(
      { message: 'Content saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving proposal content:', error);
    return Response.json(
      { error: 'Failed to save proposal content' },
      { status: 500 }
    );
  }
}

