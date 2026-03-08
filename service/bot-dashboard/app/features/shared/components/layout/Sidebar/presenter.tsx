import { NavLink } from "react-router";
import { AvatarFallback } from "~/features/shared/components/ui/avatar-fallback";

type SidebarPresenterProps = {
  readonly guilds: readonly {
    id: string;
    name: string;
    iconUrl: string | null;
  }[];
};

export function SidebarPresenter({ guilds }: SidebarPresenterProps) {
  return (
    <aside className="hidden w-64 border-r border-border p-4 lg:block">
      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`
          }
        >
          全サーバー
        </NavLink>
        {guilds.map((guild) => (
          <NavLink
            key={guild.id}
            to={`/dashboard/${guild.id}`}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`
            }
          >
            <AvatarFallback src={guild.iconUrl} name={guild.name} size="xs" />
            <span className="truncate">{guild.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
