
##  Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

### 1. Clone or Download the Project

```bash
cd /path/to/your/directory
# If using git:
# git clone <repository-url>
# cd api_calls_polish
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Or using pip3:

```bash
pip3 install -r requirements.txt
```

This will install:
- `flask>=3.0.0` - Web framework
- `aiohttp>=3.9.0` - Asynchronous HTTP client for API calls

## Running the Application

### Start the Flask Server

```bash
python app.py
```

Or using python3:

```bash
python3 app.py
```

You should see output similar to:

```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

### Access the Web Interface

Open your web browser and navigate to:

```
http://localhost:5000
```

The application will be available at this address. You can also access it from other devices on your network using your computer's IP address (e.g., `http://192.168.1.100:5000`).

## 📖 Usage Guide

### Performing a Search

1. **Enter Search Query**: Type your keywords in the "Enter Query Text" field at the top-left panel
   - You can enter multiple keywords separated by spaces
   - Example: `adenocarcinoma benign treatment`

2. **Select Boolean Operator**: Choose between:
   - **AND**: All keywords must appear in results
   - **OR**: Any keyword can appear in results

3. **Configure Options** (optional):
   - **Highlights**: Choose single or multiple color highlighting
   - **Show Errors**: Display error messages if any
   - **Plurals**: Include plural forms in search
   - **British Equivalents**: Include British English spellings

4. **Click Search**: Press the "Search" button or hit Enter

### Viewing Results

- Results appear in the bottom-left panel in a table format
- Each row shows:
  - Checkbox for selection
  - Result number
  - Document ID
  - Publication Date
  - Title/Summary

### Viewing Document Details

- **Click any result row** to view full document details in the right panel
- The document viewer shows all available fields from the patent record
- Use the toolbar buttons to navigate, zoom, print, or save

### Selecting and Exporting Results

1. **Select Results**: 
   - Check individual result checkboxes
   - Or use "Select All" to select all visible results

2. **Download Selected**:
   - Click the "Download" button (⬇️)
   - Selected results will be downloaded as a JSON file

3. **Print Selected**:
   - Click the "Print" button (🖨️)
   - A print dialog will open with formatted results

### Clearing the Search

Click the "Clear" button to reset the search form and clear all results.

## 🏗️ Project Structure

```
api_calls_polish/
│
├── app.py                      # Flask application (main server)
├── requirements.txt            # Python dependencies
├── README.md                   # This file
│
├── templates/
│   └── index.html              # Main HTML template
│
├── static/
│   ├── css/
│   │   └── style.css          # Stylesheet
│   └── js/
│       └── app.js              # JavaScript functionality
│
└── uspto_dsapi_search.py       # Standalone CLI script (optional)
```

##  API Information

This application uses the **USPTO Data Set API (DSAPI)** for enriched cited reference metadata:

- **Base URL**: `https://developer.uspto.gov/ds-api`
- **Dataset**: `enriched_cited_reference_metadata`
- **Version**: `v3`
- **Documentation**: [USPTO DSAPI Documentation](https://developer.uspto.gov/ds-api/swagger/docs/enriched_cited_reference_metadata.json)

### Available Search Fields

The API supports searching across 22 fields including:
- `publicationNumber` - Patent publication number
- `patentApplicationNumber` - Application number
- `inventorNameText` - Inventor names
- `officeActionDate` - Office action date
- `techCenter` - Technology center
- `countryCode` - Country code
- And 16 more fields...

## Troubleshooting

### SSL Certificate Errors

If you encounter SSL certificate verification errors, the application is already configured to handle this. The code includes SSL context settings that bypass certificate verification for the USPTO API.

### Port Already in Use

If port 5000 is already in use, you can change it in `app.py`:

```python
app.run(debug=True, host='0.0.0.0', port=5000)  # Change 5000 to another port
```

### No Results Found

- Check your internet connection
- Verify the USPTO API is accessible
- Try simpler search terms
- Check the browser console for error messages

### Installation Issues

If you encounter issues installing dependencies:

```bash
# Upgrade pip first
pip install --upgrade pip

# Then install requirements
pip install -r requirements.txt
```

## Configuration

### Changing Default Search Limit

Edit `app.py` line 111:

```python
limit = int(data.get('limit', 500))  # Change 500 to your preferred default
```

### Changing Server Port

Edit `app.py` line 157:

```python
app.run(debug=True, host='0.0.0.0', port=5000)  # Change port number
```
## Security Notes

- The application runs in debug mode by default (for development)
- SSL certificate verification is disabled for the USPTO API connection
- For production deployment, consider:
  - Disabling debug mode
  - Using a production WSGI server (e.g., Gunicorn)
  - Implementing proper SSL/TLS certificates
  - Adding authentication if needed

## License

This project is provided as-is for educational and research purposes. Please refer to the USPTO's terms of service for API usage guidelines.

## Acknowledgments

- **USPTO** - For providing the Data Set API
- **Flask** - Web framework
- **aiohttp** - Asynchronous HTTP client


## Updates

To update dependencies:

```bash
pip install --upgrade -r requirements.txt
```

---

**Note**: This application is a frontend interface for the USPTO DSAPI. It does not store or cache any patent data. All searches are performed in real-time against the USPTO servers.

