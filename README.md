# Aquatron Frontend

## Device Control Dashboard

The Device Control Dashboard has been completely redesigned with a modern table-based interface similar to mantisdashboard.com, featuring role-based permissions and inline editing capabilities.

### Features

#### 1. Software Test Parameters (STP) Table
- **Editable by all users** (user, admin, superadmin)
- Inline editing with dropdown selection for elements
- Add/remove test parameters dynamically
- Real-time validation and feedback
- Send test parameters to device with one click

#### 2. Device Settings Table
- **Read-only for regular users**
- **Editable for admin and superadmin users only**
- Inline editing with proper validation
- Real-time updates to device configuration
- Clear permission indicators

#### 3. Test Results History
- Chronological display of all test results
- Status indicators (Success/Failed)
- Sortable by timestamp, element, quantity, and status
- Automatic updates via WebSocket

### Permission System

| Feature | User | Admin | Superadmin |
|---------|------|-------|------------|
| View STP | ✅ | ✅ | ✅ |
| Edit STP | ✅ | ✅ | ✅ |
| Send STP | ✅ | ✅ | ✅ |
| View Device Settings | ✅ | ✅ | ✅ |
| Edit Device Settings | ❌ | ✅ | ✅ |
| View Test Results | ✅ | ✅ | ✅ |

### Table Features

#### SortableTable Component
- **Sorting**: Click column headers to sort data
- **Inline Editing**: Click edit icons to modify values
- **Add/Delete**: Add new entries or remove existing ones
- **Responsive**: Works on desktop and mobile devices
- **Permission-based**: UI adapts based on user role

#### Column Types
- **Text**: Standard text input
- **Number**: Numeric input with validation
- **Select**: Dropdown selection
- **Read-only**: Display only, no editing

### Usage

1. **Adding Test Parameters**:
   - Click "Add New" button in STP table
   - Select element from dropdown
   - Set quantity, voltage, and frequency
   - Click "Send Test Parameters" to execute

2. **Modifying Device Settings** (Admin/Superadmin only):
   - Click edit icon next to any editable value
   - Enter new value
   - Click save icon to confirm
   - Changes are automatically sent to device

3. **Viewing Results**:
   - Test results appear automatically after sending parameters
   - Results are sorted by timestamp (newest first)
   - Status chips show success/failure

### Technical Implementation

- **Frontend**: React with Material-UI components
- **State Management**: React hooks with context
- **Real-time Updates**: WebSocket integration
- **API Integration**: RESTful endpoints with JWT authentication
- **Permission System**: Role-based access control (RBAC)

### File Structure

```
src/
├── components/
│   └── SortableTable.jsx          # Enhanced table component
├── pages/
│   ├── DeviceControl.jsx          # Main device control dashboard
│   └── AdminPanel.jsx             # Admin panel with device settings
└── auth/
    └── AuthContext.jsx            # Authentication and role management
```

### API Endpoints

- `GET /api/device/settings` - Get device settings (Admin/Superadmin)
- `POST /api/device/settings` - Update device settings (Admin/Superadmin)
- `POST /api/device/sw-parameters` - Send test parameters (All users)
- `GET /api/device/status` - Get device status (All users)

### Styling

The interface uses Material-UI's design system with:
- Consistent color scheme
- Proper spacing and typography
- Hover effects and transitions
- Responsive grid layout
- Card-based component organization
