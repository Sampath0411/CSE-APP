-- Create letter_requests table for real-time letter request management
CREATE TABLE IF NOT EXISTS letter_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    letter_type VARCHAR(50) NOT NULL CHECK (letter_type IN ('bonafide', 'study', 'loan', 'internship')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    additional_details JSONB,
    serial_number VARCHAR(255),
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_letter_requests_student_id ON letter_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_letter_requests_status ON letter_requests(status);
CREATE INDEX IF NOT EXISTS idx_letter_requests_requested_at ON letter_requests(requested_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE letter_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
-- In production, you should restrict this appropriately
CREATE POLICY "Allow all operations on letter_requests" ON letter_requests
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable real-time for letter_requests
ALTER PUBLICATION supabase_realtime ADD TABLE letter_requests;
