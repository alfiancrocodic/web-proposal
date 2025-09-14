import { NextRequest, NextResponse } from 'next/server';
import { getProposals, createProposal, ProposalFormData } from '@/lib/api';

/**
 * GET handler untuk mengambil semua proposals
 * @returns Response dengan daftar proposals
 */
export async function GET() {
  try {
    const proposals = await getProposals();
    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

/**
 * POST handler untuk membuat proposal baru
 * @param request - Request object dengan data proposal
 * @returns Response dengan proposal yang baru dibuat
 */
export async function POST(request: NextRequest) {
  try {
    const body: ProposalFormData = await request.json();
    
    // Validasi data yang diperlukan
    if (!body.project_id || !body.version) {
      return NextResponse.json(
        { error: 'Project ID and version are required' },
        { status: 400 }
      );
    }

    const newProposal = await createProposal(body);
    return NextResponse.json(newProposal, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}