import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { usePagination, useRowSelect, useSortBy, useTable } from "react-table";
import { NavLink, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { CAROUSELCOL } from "../utils/Col.js";
import Couponpop from "./Couponpop.js";
import CouponUpdate from "./CouponUpdate.js";
import Carouselcreatepop from "./Carouselcreatepop.js";
import Carouselupdate from "./Carouselupdate.js";
import { url } from "../utils/urls.js";
import supabase from "../utils/supabaseConfig.js";

export default function Carousels(props) {
  const nav = useNavigate();
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken")
      ? localStorage.getItem("authToken" + "")
      : "",
  );
  const [session_id, setSession_id] = useState(
    localStorage.getItem("session_id")
      ? localStorage.getItem("session_id" + "")
      : "",
  );
  const [carousels, setCarousels] = useState([]);
  const [popup, setPopup] = useState(false);
  const [updatepopup, setUpdatePopup] = useState(false);
  const [apiData, setApiData] = useState([]);
  const [preData, setPreData] = useState("");
  const [storeid, setStoreid] = useState(props.storeId);

  // const fetchData = async () => {
  //   toast("Carousels loading please wait", {
  //     progress: true,
  //   });
  //   try {
  //     const response = await axios.get(`${url}/v1/app/carasoule/get`, {
  //       headers: { authtoken: authToken, sessionid: session_id },
  //     });
  //     toast.dismiss();
  //     setCarousels(response.data.data);
  //     setApiData(response.data.data);
  //     setPageSize(20);
  //   } catch (error) {
  //     toast.dismiss();
  //     console.log(error);
  //     setCarousels([]);
  //     setApiData([]);
  //   }
  // };

  const fetchData = async () => {
    toast("Carousels loading please wait", {
      progress: true,
    });
    const { data, error } = await supabase
      .from("carousel")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast(error.response?.data?.error || "request failed", {
        type: "error",
      });
      console.log(error);
    } else setCarousels(data || []);

    toast.dismiss();
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this carousel?")) {
      return;
    }
    try {
      toast("Deleting carousel...", { progress: true });
      await axios.delete(`${url}/v1/app/carasoule/${id}`, {
        headers: { authtoken: authToken, sessionid: session_id },
      });
      toast.dismiss();
      toast.success("Carousel deleted successfully");
      // Update the carousels state by filtering out the deleted item
      setUpdatePopup(false);
      setCarousels(carousels.filter((carousel) => carousel.id !== id));
      setApiData(apiData.filter((carousel) => carousel.id !== id));
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to delete carousel");
      console.error(error);
    }
  };

  useEffect(() => {
    props.setName("Carousels");
    fetchData();
  }, []);

  const data = useMemo(() => carousels, [carousels]);
  const columns = useMemo(() => CAROUSELCOL, []);
  const tableInstance = useTable(
    { columns, data },
    useSortBy,
    usePagination,
    useRowSelect,
  );
  const {
    getTableProps,
    getTableBodyProps,
    selectedFlatRows,
    headerGroups,
    page,
    nextPage,
    previousPage,
    gotoPage,
    pageOptions,
    setPageSize,
    state,
    pageCount,
    prepareRow,
  } = tableInstance;
  const { pageIndex } = state;

  return (
    <div className="page">
      <div className="content">
        <Carouselcreatepop
          trigger={popup}
          setTrigger={setPopup}
          fetchdata={fetchData}
        />
        <Carouselupdate
          trigger={updatepopup}
          setTrigger={setUpdatePopup}
          preData={preData}
          fetchdata={fetchData}
          handleDelete={handleDelete}
        />
        <div className="add-link">
          <div className="tab">
            <button
              className="cat-popup page-big-headings"
              onClick={() => {
                setPopup(true); // Fixed: Changed "true" to true
              }}
            >
              Add New Carousel
            </button>
            <span className="med-font">Manage mobile main screen carousel</span>
          </div>
        </div>
        <div className="services-data">
          <div className="services">
            <div>
              <span className="bigger-font">Carousels</span>
            </div>
            <div className="search-div"></div>
          </div>
          {data.length ? (
            <div className="table">
              <table {...getTableProps()}>
                <thead>
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps(),
                          )}
                        >
                          {column.render("Header")}
                          {column.isSorted
                            ? column.isSortedDesc
                              ? "🔽"
                              : "🔼"
                            : ""}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr
                        {...row.getRowProps()}
                        onClick={(r) => {
                          setUpdatePopup(true);
                          const data = carousels.find((i) => {
                            return row.original.id === i.id;
                          });
                          setPreData(data);
                        }}
                        className="tr"
                        style={{ cursor: "pointer" }}
                      >
                        {row.cells.map((cell) => {
                          return (
                            <td {...cell.getCellProps()}>
                              {cell.render("Cell")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination-btns">
                <button
                  onClick={() => gotoPage(0)}
                  className={pageIndex > 0 ? "ablepagibtn" : "pagination-btn"}
                >
                  {"<<"}
                </button>
                <button
                  onClick={() => previousPage()}
                  className={pageIndex > 0 ? "ablepagibtn" : "pagination-btn"}
                >
                  Prev
                </button>
                <span className="pagination-btn">
                  {pageIndex + 1} of {pageOptions.length}
                </span>
                <button
                  onClick={() => nextPage()}
                  className={
                    pageIndex + 1 < pageCount ? "ablepagibtn" : "pagination-btn"
                  }
                >
                  Next
                </button>
                <button
                  onClick={() => gotoPage(pageCount - 1)}
                  className={
                    pageIndex + 1 < pageCount ? "ablepagibtn" : "pagination-btn"
                  }
                >
                  {">>"}
                </button>
              </div>
            </div>
          ) : (
            <div className="table-pg">
              <span className="tpg">No Carousels available</span>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
