import React, { Component } from "react";
import { callApi, getSession } from "./api";
import "./MenuBar.css";

class MenuBar extends Component {
  state = {
    menuitems: [],
    active: null,
  };

  componentDidMount() {
    const csrid = getSession("csrid");
    if (!csrid) return;

    callApi(
      "POST",
      "http://localhost:8910/menus/getmenusbyrole",
      JSON.stringify({ csrid }),
      this.loadMenus
    );
  }

  loadMenus = (res) => {
    const data = typeof res === "string" ? JSON.parse(res) : res;

    // 🔥 Menu label mapping for specific IDs
    const labelMap = {
      "2": "Complaints",
      "12": "Escalated Complaints"
    };

    // Apply label mapping
    const updatedData = data.map(item => ({
      ...item,
      menu: labelMap[String(item.mid)] || item.menu
    }));

    this.setState({
      menuitems: updatedData,
      active: updatedData[0]?.mid,
    });

    // 🔥 Auto load first page
    if (updatedData.length) {
      this.props.onMenuClick(String(updatedData[0].mid));
    }
  };

  render() {
    const { menuitems, active } = this.state;

    return (
      <div className="menubar">
        <ul className="menu-pill">
          {menuitems.map((m) => (
            <li
              key={m.mid}
              className={String(active) === String(m.mid) ? "active" : ""}
              onClick={() => {
                this.setState({ active: m.mid });
                this.props.onMenuClick(String(m.mid));
              }}
            >
              <img src={m.icon || "/default.png"} alt="" />
              <span>{m.menu}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default MenuBar;
