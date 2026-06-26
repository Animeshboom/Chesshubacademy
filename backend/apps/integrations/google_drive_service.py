import os
from django.conf import settings
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
import io


class GoogleDriveService:
    @staticmethod
    def get_drive_service():
        """
        Initializes Google Drive API service using Service Account.
        """
        creds_file = getattr(settings, 'GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE', '')
        # Search relative to base directory
        full_path = os.path.join(settings.BASE_DIR, creds_file) if creds_file else ''

        if not full_path or not os.path.exists(full_path):
            # No service account file, return None for local storage fallback
            return None

        try:
            scopes = ['https://www.googleapis.com/auth/drive']
            creds = service_account.Credentials.from_service_account_file(
                full_path, scopes=scopes
            )
            return build('drive', 'v3', credentials=creds)
        except Exception as e:
            print(f"Error initializing Google Drive API: {e}")
            return None

    @classmethod
    def upload_file(cls, file_name: str, file_content_bytes: bytes, mime_type: str = 'application/pdf'):
        """
        Uploads file content bytes to Google Drive or falls back to local media path.
        Returns the drive_file_id (or local URL path).
        """
        service = cls.get_drive_service()
        folder_id = getattr(settings, 'GOOGLE_DRIVE_SHARED_FOLDER_ID', '')

        if not service:
            # Local fallback: Save to media/gdrive_fallback/
            fallback_dir = os.path.join(settings.MEDIA_ROOT, 'gdrive_fallback')
            os.makedirs(fallback_dir, exist_ok=True)
            
            # Sanitise file_name to avoid directory traversal
            safe_name = os.path.basename(file_name)
            local_path = os.path.join(fallback_dir, safe_name)
            
            with open(local_path, 'wb') as f:
                f.write(file_content_bytes)
            
            # Return relative path as ID
            return f"local_fallback/{safe_name}"

        # Setup Drive upload metadata
        file_metadata = {'name': file_name}
        if folder_id and folder_id != 'placeholder_shared_folder_id':
            file_metadata['parents'] = [folder_id]

        try:
            # In-memory buffer upload
            fh = io.BytesIO(file_content_bytes)
            from googleapiclient.http import MediaIoBaseUpload
            media = MediaIoBaseUpload(fh, mimetype=mime_type, resumable=True)

            uploaded_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            return uploaded_file.get('id')
        except Exception as e:
            print(f"Error uploading to Google Drive: {e}")
            # Final fallback: Save local file
            fallback_dir = os.path.join(settings.MEDIA_ROOT, 'gdrive_fallback')
            os.makedirs(fallback_dir, exist_ok=True)
            safe_name = os.path.basename(file_name)
            local_path = os.path.join(fallback_dir, safe_name)
            with open(local_path, 'wb') as f:
                f.write(file_content_bytes)
            return f"local_fallback/{safe_name}"
            
    @classmethod
    def download_file(cls, file_id: str):
        """
        Retrieves file bytes from Google Drive or local fallback.
        Returns (bytes, file_name).
        """
        if file_id.startswith('local_fallback/'):
            # Local fallback download
            file_name = file_id.split('/')[-1]
            local_path = os.path.join(settings.MEDIA_ROOT, 'gdrive_fallback', file_name)
            if os.path.exists(local_path):
                with open(local_path, 'rb') as f:
                    return f.read(), file_name
            return b'', file_name

        service = cls.get_drive_service()
        if not service:
            return b'', 'unknown_file.pdf'

        try:
            # Fetch file metadata to get the name
            meta = service.files().get(fileId=file_id, fields='name').execute()
            file_name = meta.get('name', 'download.pdf')

            # Download actual bytes
            request = service.files().get_media(fileId=file_id)
            file_buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(file_buffer, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
            
            return file_buffer.getvalue(), file_name
        except Exception as e:
            print(f"Error downloading from Google Drive: {e}")
            return b'', 'error_file.pdf'

    @classmethod
    def list_files_in_folder(cls, folder_id: str = None):
        """
        Lists files in the Google Drive folder. If folder_id is not specified, 
        defaults to GOOGLE_DRIVE_SHARED_FOLDER_ID from settings.
        If service account is not configured, lists files in the local_fallback media directory.
        """
        service = cls.get_drive_service()
        if not folder_id:
            folder_id = getattr(settings, 'GOOGLE_DRIVE_SHARED_FOLDER_ID', '')

        # Parse folder_id out of a full Google Drive URL if needed
        if folder_id and "folders/" in folder_id:
            folder_id = folder_id.split("folders/")[-1].split("?")[0]

        if not service:
            fallback_dir = os.path.join(settings.MEDIA_ROOT, 'gdrive_fallback')
            if not os.path.exists(fallback_dir):
                return []
            files = []
            for fname in os.listdir(fallback_dir):
                fpath = os.path.join(fallback_dir, fname)
                if os.path.isfile(fpath):
                    files.append({
                        'id': f"local_fallback/{fname}",
                        'name': fname,
                        'webContentLink': f"/media/gdrive_fallback/{fname}",
                        'webViewLink': f"/media/gdrive_fallback/{fname}"
                    })
            return files

        try:
            query = ""
            if folder_id and folder_id != 'placeholder_shared_folder_id':
                query = f"'{folder_id}' in parents and trashed = false"
            else:
                query = "trashed = false"

            results = service.files().list(
                q=query,
                pageSize=100,
                fields="files(id, name, webContentLink, webViewLink)"
            ).execute()
            return results.get('files', [])
        except Exception as e:
            print(f"Error listing files from Google Drive: {e}")
            return []

    @classmethod
    def delete_file(cls, file_id: str):
        """
        Deletes a file from Google Drive or local fallback storage.
        """
        if not file_id:
            return False
            
        if file_id.startswith('local_fallback/'):
            file_name = file_id.split('/')[-1]
            local_path = os.path.join(settings.MEDIA_ROOT, 'gdrive_fallback', file_name)
            try:
                if os.path.exists(local_path):
                    os.remove(local_path)
                    return True
            except Exception as e:
                print(f"Error deleting local fallback file {file_name}: {e}")
            return False

        service = cls.get_drive_service()
        if not service:
            return False

        try:
            service.files().delete(fileId=file_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting file from Google Drive: {e}")
            return False
