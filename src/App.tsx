import { useState, useEffect } from 'react'
import { BriefcaseIcon, CircleStackIcon, Cog8ToothIcon, GlobeAltIcon, LinkIcon } from '@heroicons/react/24/solid'
import './App.css'

// Define the possible statuses based on the API response 'running' or mapped failure states
type ServiceStatus = 'UP' | 'OK' | 'DOWN' | 'WARN';
type ApiStatus = 'running' | 'ok' | 'stopped' | 'failed' | 'warning';

type ComponentType = 'service' | 'website' | 'webapi' | 'process' | 'batch';

// Define the interface for a server info returned by the API
interface ServerInfo {
  database: string; // The database name
}

// Define the interface for a single service as returned by the API
interface ApiService {
  id: string; // The ID from the API (e.g., "CRMMessenger")
  display_name: string; // The service name to display
  type: ComponentType;
  status: ApiStatus; // The status string from the API
  status_details: string;
}

// Interface for the state managed in the component (transformed data)
interface Service {
  id: string;
  name: string;
  icon: ComponentType; // Placeholder for the icon/logo source
  currentStatus: ServiceStatus; // Our component's normalized status
  statusDetails: string;
}

// 1. Utility function to map API status to our component's normalized status
const mapApiStatusToStatus = (apiStatus: ApiStatus): ServiceStatus => {
    switch (apiStatus) {
        case 'running':
            return 'UP';
        case 'ok':
            return 'OK';
        case 'warning':
            return 'WARN';
        case 'failed':
        case 'stopped':
        default:
            return 'DOWN';
    }
};

// 2. Utility function to map normalized status to styles and text (retained from previous design)
const getStatusStyles = (status: ServiceStatus) => {
  switch (status) {
    case 'UP':
      return {
        text: 'UP',
        className: 'bg-green-500 text-white',
      };
    case 'OK':
      return {
        text: 'OK',
        className: 'bg-green-500 text-white',
      };
    case 'DOWN':
      return {
        text: 'DOWN',
        className: 'bg-red-500 text-white',
      };
    case 'WARN':
      return {
        text: 'WARN',
        className: 'bg-yellow-500 text-gray-800',
      };
    default:
      return {
        text: 'UNKNOWN',
        className: 'bg-gray-400 text-white',
      };
  }
};

// 3. Utility function to map component types to icons
const getComponentIcon = (type: ComponentType) => {
  switch (type) {
    case 'service':
      return Cog8ToothIcon;
    case 'process':
      return CircleStackIcon;
    case 'batch':
      return BriefcaseIcon;
    case 'website':
      return GlobeAltIcon
    case 'webapi':
      return LinkIcon
    default:
      return CircleStackIcon;
  }
};

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [serverInfo, setServerInfo] = useState<ServerInfo>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. useEffect hook for the API call
  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ServerInfo = await response.json();

        setServerInfo(data);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch service info:", e);
        setError("Failed to fetch service info. Please check the network or server status.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchServerInfo();

    const fetchStatuses = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}allstatuses`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ApiService[] = await response.json();
        
        // Transform the API data into our component's Service structure
        const transformedServices: Service[] = data.map(apiService => ({
          id: apiService.id,
          name: apiService.display_name,
          icon: apiService.type,
          currentStatus: mapApiStatusToStatus(apiService.status),
          statusDetails: apiService.status_details
        }));

        setServices(transformedServices);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch service statuses:", e);
        setError("Failed to load service data. Please check the network or server status.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, []); // Empty dependency array means this runs only once after the initial render

  // --- Rendering Logic ---

  if (isLoading) {
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto font-sans text-center">
        <p className="text-gray-600">Loading service statuses...</p>
        {/* Simple loading spinner placeholder */}
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 shadow-lg rounded-lg max-w-2xl mx-auto font-sans">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-5xl mx-auto font-sans">
      {/* Header using Grid for 3 columns */}
      {/* Define 6 columns: 2 for Component, 1 for Status (fixed), 3 for Details (grow) */}
      <div className="grid grid-cols-6 gap-4 border-b pb-3 mb-3 text-gray-500 font-semibold text-sm">
        
        {/* Col 1 & 2: Component Name - Span 2 columns */}
        <h2 className="col-span-2 text-lg font-bold text-gray-700 truncate">
          Monitoring Component ({serverInfo?.database})
        </h2>
        
        {/* Col 3: Status - Center-aligned */}
        <span className="text-lg font-bold text-gray-700 text-center">Status</span>
        
        {/* Col 4, 5, & 6: Details - Span 3 columns, left-aligned */}
        <span className="col-span-3 text-lg font-bold text-gray-700 text-left truncate">Details</span>
      </div>

      {services.map((service) => {
        const { text, className } = getStatusStyles(service.currentStatus);
        const Icon = getComponentIcon(service.icon);

        return (
          // Grid for each row: Define 6 main areas to match the header.
          <div
            key={service.id}
            className="grid grid-cols-6 gap-4 items-start py-3 border-b last:border-b-0"
          >
            
            {/* Component Name/Icon (Column 1 & 2) - Fixed width with Truncation */}
            <div className="col-span-2 flex items-center space-x-3 min-w-0">
              <Icon className="size-6 shrink-0"/>
              {/* The actual text container needs the truncation classes */}
              <span className="text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {service.name}
              </span>
            </div>

            {/* Status Button (Column 3) - Centered */}
            <div className="flex justify-center">
              <div
                className={`px-4 py-1 text-xs font-bold rounded-md min-w-[80px] text-center ${className}`}
                aria-live="polite"
              >
                {text}
              </div>
            </div>
            
            {/* Details Column (Column 4, 5, & 6) - Spans 3 columns with Truncation */}
            <div className="col-span-3 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap text-left">
              {service.statusDetails || 'No detailed information available for this component.'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default App
