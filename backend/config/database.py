from supabase import create_client, Client
from config.settings import settings

# Initialize the Supabase client globally
# This single instance will be imported by our services to execute DB operations
supabase: Client = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_KEY
)